/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *             Компонент Просмотр списков объектов                  *
 *                                                                  *
 *******************************************************************/


import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkFeatureSamplesWidget from '../task/GwtkFeatureSamplesWidget.vue';
import MapObject from '~/mapobject/MapObject';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import MarkerStyle from '~/style/MarkerStyle';
import { MapObjectPanelState } from '~/taskmanager/TaskManager';
import GeoJSON, { FeatureType, GeoJsonType } from '~/utils/GeoJSON';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';
import VectorLayer from '~/maplayers/VectorLayer';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import {
    CheckCrossByLayersIncludePointsParams,
    CheckCrossByLayersIncludePointsResponse,
    CheckDistanceByLayers,
    CheckDistanceByLayersIncludePointsResponse,
    CheckFromEndByLayers,
    CheckFromStartByLayers,
    Condition,
    CrossResultOperators,
    ErrorResponse,
    GetFeatureParams,
    GetRequestDataResponse,
    GetStatusDataResponse,
    ObjectListNumber,
    Operator
} from '~/services/RequestServices/RestService/Types';
import { CROSSTYPE, GETFRAME, METRIC, OUTTYPE } from '~/services/RequestServices/common/enumerables';
import Utils from '~/services/Utils';
import { BrowserService } from '~/services/BrowserService';
import CsvEditor, { ColumnSeparator } from '~/services/Utils/CsvEditor';
import RequestService from '~/services/RequestServices/common/RequestService';
import { ServiceResponse } from '~/services/Utils/Types';
import ServiceWmsLayer from '~/maplayers/ServiceWmsLayer';
import GISWebServiceVectorLayer from '~/maplayers/GISWebServiceVectorLayer';
import { Unit } from '~/utils/WorkspaceManager';
import GwtkError from '~/utils/GwtkError';

export enum TypeOfSearch {
    Cross,
    Distance,
    Start,
    End
}

export const ABORT_SEARCH = 'gwtkfeaturesamples.abortsearch';
export const CLICK_BACK_BUTTON = 'gwtkfeaturesamples.slickbackbutton';
export const CREATE_GROUP = 'gwtkfeaturesamples.creategroup';
export const CREATE_GROUP_FROM_SEARCH_RESULT = 'gwtkfeaturesamples.creategroupfromsearchresult';
export const DELETE_GROUP = 'gwtkfeaturesamples.deletegroup';
export const DOWNLOAD_FILE = 'gwtkfeaturesamples.downloadfile';
export const DOWNLOAD_LAYER = 'gwtkfeaturesamples.downloadlayer';
export const RUN_SEARCH = 'gwtkfeaturesamples.runsearch';
export const SELECT_ITEM_LIST = 'gwtkfeaturesamples.selectitemlist';
export const SET_FILE_NAME = 'gwtkfeaturesamples.setfilename';
export const SET_LAYER_NAME = 'gwtkfeaturesamples.setlayername';
export const SET_SEARCH_FIRST_ITEM_ID = 'gwtkfeaturesamples.setsearchfirstitemid';
export const SET_SEARCH_OPERATORS = 'gwtkfeaturesamples.setselectedoperators';
export const SET_SEARCH_SECOND_ITEM_ID = 'gwtkfeaturesamples.setsearchseconditemid';
export const SHOW_ITEM_LIST = 'gwtkfeaturesamples.showitemlist';
export const TOGGLE_ITEM_GROUP = 'gwtkfeaturesamples.clickonitemgroup';
export const TOGGLE_LAYER_VISIBILITY = 'gwtkfeaturesamples.togglelayervisibility';
export const SET_TYPE_OF_SEARCH = 'gwtkfeaturesamples.settypeofsearch';
export const SET_LENGTH_UNIT = 'gwtkfeaturesamples.setlengthunit';
export const SET_CONDITION_OPERATOR_ID = 'gwtkfeaturesamples.setconditionoperatorid';
export const SET_DISTANCE_VALUE = 'gwtkfeaturesamples.setdistancevalue';

export const searchOperatorList = [
    {
        text: i18n.tc('featuresamples.Crosses').toString(),
        value: Operator.Cross
    }, {
        text: i18n.tc('featuresamples.Touches').toString(),
        value: Operator.Touch
    },
    // {
    //     text: 'Накладывается',
    //     value: Operator.Overlap
    // },
    {
        text: i18n.tc('featuresamples.Located inside').toString(),
        value: Operator.Inside
    },
    // {
    //     text: 'Совпадает',
    //     value: Operator.Match
    // },
    {
        text: i18n.tc('featuresamples.Does not cross').toString(),
        value: Operator.NotCross
    }, {
        text: i18n.tc('featuresamples.Does not touch').toString(),
        value: Operator.NotTouch
    },
    // {
    //     text: 'Не накладывается',
    //     value: Operator.NoOverlap
    // },
    {
        text: i18n.tc('featuresamples.Located outside').toString(),
        value: Operator.Outside
    },
    // {
    //     text: 'Не совпадает',
    //     value: Operator.NoMatch
    // },
    // {
    //     text: 'Обратное выделение (ранее выделенных элементов)',
    //     value: Operator.ReverseSelection
    // }
];
export const conditionOperatorList = [
    {
        text: '<',
        value: Condition.Less
    },
    {
        text: '=',
        value: Condition.Equal
    },
    {
        text: '<=',
        value: Condition.EqLess
    },
    {
        text: '>',
        value: Condition.Greater
    },
    {
        text: '!=',
        value: Condition.NoEqual
    },
    {
        text: '>=',
        value: Condition.EqGreater
    },
    {
        text: '*',
        value: Condition.Any
    }
];

export type GwtkFeatureSamplesState = {
    [ABORT_SEARCH]: undefined;
    [CLICK_BACK_BUTTON]: null;
    [CREATE_GROUP]: null;
    [CREATE_GROUP_FROM_SEARCH_RESULT]: null;
    [DELETE_GROUP]: number;
    [DOWNLOAD_FILE]: undefined;
    [DOWNLOAD_LAYER]: string;
    [RUN_SEARCH]: undefined;
    [SELECT_ITEM_LIST]: number;
    [SET_FILE_NAME]: string;
    [SET_LAYER_NAME]: string;
    [SET_SEARCH_FIRST_ITEM_ID]: number;
    [SET_SEARCH_OPERATORS]: Operator[];
    [SET_SEARCH_SECOND_ITEM_ID]: number;
    [SHOW_ITEM_LIST]: number;
    [TOGGLE_ITEM_GROUP]: number;
    [TOGGLE_LAYER_VISIBILITY]: string;
    [SET_TYPE_OF_SEARCH]: number;
    [SET_LENGTH_UNIT]: Unit;
    [SET_CONDITION_OPERATOR_ID]: string;
    [SET_DISTANCE_VALUE]: string;
}

export type ResultFile = { id: string; fileName: string; };

export type GwtkFeatureSamplesSearchResult = {
    operators?: Operator[];
    layer: { xId: string; alias: string; visible: boolean; };
    file?: ResultFile;
    totalObjectsCount: number;
};

export type GwtkFeatureSamplesTaskWidgetParams = {
    setState: GwtkFeatureSamplesTask['setState'];
    selectedObjectCount: number;
    groupList: WidgetGroup[];
    activeListIndices: number[];
    searchProps: {
        searchResult: GwtkFeatureSamplesSearchResult | null;
        firstSearchItemId: number;
        secondSearchItemId: number;
        selectedOperators: Operator[];
        searchProgress: null | number;
        searchFirstItemGroupList: WidgetGroup[];
        searchSecondItemGroupList: WidgetGroup[];
        searchOperatorList: { text: string; value: Operator; }[];
        csvCreation: boolean;
        typeOfSearch: TypeOfSearch;
        conditionOperatorList: { text: string; value: Condition; }[];
        searchLengthUnit: Unit;
        conditionOperatorId: Condition;
        distanceValue: string
    }
}

export type WidgetGroup = {
    id: number,
    name: string,
    image: string;
};

type LayerItem = {
    xId: string;
    objects: MapObject[];
};

type Group = {
    id: number,
    layers: LayerItem[];
};

type StoredLayerItem = {
    xId: string;
    objectItems: { gmlId: string; }[];
};

type StoredGroup = {
    id: number;
    name: string;
    layers: StoredLayerItem[];
}
type RequestData = {
    type: TypeOfSearch.Cross,
    params: CheckCrossByLayersIncludePointsParams[]
} | {
    type: TypeOfSearch.Distance,
    params: CheckDistanceByLayers[]
} | {
    type: TypeOfSearch.Start,
    params: CheckFromStartByLayers[]
} | {
    type: TypeOfSearch.End,
    params: CheckFromEndByLayers[]
}

type LayerParams = {
    LAYER: string;
    IDLIST: string;
    IDINOBJECTLIST: string;
};

type WorkSpaceData = { groupList: StoredGroup[], names: { layerName: string; fileName: string; } };


/**
 * Компонент "Просмотр списков объектов"
 * @class GwtkFeatureSamplesTask
 * @extends Task
 * @description
 */
export default class GwtkFeatureSamplesTask extends Task {

    protected workspaceData: WorkSpaceData = {
        groupList: [],
        names: { layerName: i18n.tc('phrases.Result'), fileName: i18n.tc('phrases.Result') }
    };

    private readonly palette = [
        {
            stroke: '#FF0000',
            fill: '#00FF7F',
            pathD: 'M19 21L6 46L32 46 z' // triangle
        },
        {
            stroke: '#FFA500',
            fill: '#00FFFF',
            pathD: 'M 3 32 a 1 1 0 0 0 32 0M 3 32 a 1 1 0 0 1 32 0' // circle
        },
        {
            stroke: '#FFC0CB',
            fill: '#7FFF00',
            pathD: 'M 4 17L34 17L34 47L4 47 z' // square
        },
        {
            stroke: '#5CACEE',
            fill: '#DE3163',
            pathD: 'M 19 18L33 32L19 46L5 32 z' // diamonds
        },
        {
            stroke: '#1874CD',
            fill: '#FFFF00',
            pathD: 'M18 19L23 27L32 28L26 36L27 45L18 41L9 45L10 36L5 28L13 27L18 19Z' // star
        }
    ];

    private readonly abortXhr: { id: string; abort: () => void; }[] = [];

    private readonly percentCompleted: { id: string; value: number; }[] = [];

    private serviceLayer?: ServiceWmsLayer;

    private readonly viewServiceLayers: ServiceWmsLayer[] = [];

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & GwtkFeatureSamplesTaskWidgetParams;

    private readonly cachedGroups: Group[] = [];

    private totalRequests = 1;

    private result?: { [key: string]: CheckCrossByLayersIncludePointsResponse['restmethod']['outparams'] };
    private resultDistance?: { [key: string]: CheckDistanceByLayersIncludePointsResponse };

    private readonly requestIdListMap = new Map<string, string[]>();

    private readonly highlightedItemGUIDs = new Map<number, { [key: string]: string; }>();

    private get groupId() {
        let num = 0;

        for (let i = 0; i < this.workspaceData.groupList.length; i++) {
            num = Math.max(num, this.workspaceData.groupList[i].id);
        }

        return num + 1;
    }

    private get groupDefaultName() {
        return i18n.tc('featuresamples.List') + ' ' + this.groupId;
    }

    /**
     * @constructor GwtkFeatureSamplesTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);


        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            selectedObjectCount: 0,
            groupList: [],
            activeListIndices: [],

            searchProps: {
                searchResult: null,
                firstSearchItemId: -1,
                secondSearchItemId: -1,
                selectedOperators: [Operator.Cross],
                searchProgress: null,
                searchFirstItemGroupList: [],
                searchSecondItemGroupList: [],
                searchOperatorList: searchOperatorList,
                csvCreation: false,
                conditionOperatorList: conditionOperatorList,
                searchLengthUnit: Unit.Meters,
                conditionOperatorId: Condition.EqGreater,
                distanceValue: '0',
                typeOfSearch: TypeOfSearch.Cross,
            }
        };

        this.onSelectObjects();

    }

    protected destroy(): void {
        super.destroy();
        this.widgetProps.activeListIndices.splice(0);
        if (this.serviceLayer) {
            this.serviceLayer.destroy();
        }
        this.viewServiceLayers.forEach(serviceLayer => serviceLayer.destroy());
        this.map.requestRender();
    }

    setup(): void {
        super.setup();

        if (!this.workspaceData) {
            this.workspaceData = {
                groupList: [],
                names: { layerName: i18n.tc('phrases.Result'), fileName: i18n.tc('phrases.Result') }
            };
        }

        this.validateWorkspaceData();

        for (let i = 0; i < this.workspaceData.groupList.length; i++) {
            this.widgetProps.groupList.push({
                id: this.workspaceData.groupList[i].id,
                name: this.workspaceData.groupList[i].name,
                image: this.getListObjectStyle(i).marker?.markerDescription?.image || ''
            });
        }

        this.updateSearchGroupList();
    }

    getResultOperationName(operationType: CrossResultOperators, operator: Operator): string {
        if (!this.widgetProps.searchProps.searchResult) {
            return '-';
        }
        switch (operationType) {
            case CROSSTYPE[CROSSTYPE.MainInside]:
                if (operator === Operator.NotCross) {
                    return i18n.tc('featuresamples.Does not cross');
                } else if (operator === Operator.NotTouch) {
                    return i18n.tc('featuresamples.Does not touch');
                }
                break;
            case CROSSTYPE[CROSSTYPE.Inside]:
                if (operator === Operator.Inside) {
                    return i18n.tc('featuresamples.Located inside');
                } else if (operator === Operator.NotCross) {
                    return i18n.tc('featuresamples.Does not cross');
                } else if (operator === Operator.NotTouch) {
                    return i18n.tc('featuresamples.Does not touch');
                }
                break;
            case CROSSTYPE[CROSSTYPE.Cross]:
                if (operator === Operator.Cross) {
                    return i18n.tc('featuresamples.Crosses');
                }
                break;
            case CROSSTYPE[CROSSTYPE.NotCross]:
                if (operator === Operator.NotCross) {
                    return i18n.tc('featuresamples.Does not cross');
                } else if (operator === Operator.NotTouch) {
                    return i18n.tc('featuresamples.Does not touch');
                } else if (operator === Operator.Outside) {
                    return i18n.tc('featuresamples.Located outside');
                }
                break;
            case CROSSTYPE[CROSSTYPE.CrossInsideList]:
                if (operator === Operator.Touch) {
                    return i18n.tc('featuresamples.Touches');
                }
                break;
            case CROSSTYPE[CROSSTYPE.CrossOutSideList]:
                if (operator === Operator.Touch) {
                    return i18n.tc('featuresamples.Touches');
                } else if (operator === Operator.Outside) {
                    return i18n.tc('featuresamples.Located outside');
                }
                break;
        }
        return '-';
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkFeatureSamplesWidget';
        const sourceWidget = GwtkFeatureSamplesWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
    }

    onSelectObjects() {
        let selectedObjectCount = 0;
        this.map.getSelectedObjects().forEach(mapOblect => {
            if (mapOblect.vectorLayer instanceof GISWebServiceVectorLayer) {
                selectedObjectCount++;
            }
        });

        this.widgetProps.selectedObjectCount = selectedObjectCount;
    }

    setState<K extends keyof GwtkFeatureSamplesState>(key: K, value: GwtkFeatureSamplesState[K]) {
        switch (key) {
            //lists
            case CREATE_GROUP:

                let description = '';

                let serviceUrl;
                for (const mapObject of this.map.getSelectedObjectsIterator()) {
                    const layer = mapObject.vectorLayer;

                    if (layer instanceof GISWebServiceVectorLayer) {
                        if (serviceUrl === undefined) {
                            serviceUrl = layer.serviceUrl;
                        }
                        if (serviceUrl !== layer.serviceUrl) {
                            description = i18n.t('featuresamples.The list contains objects from several servers, some operations are not available') + '';
                            break;
                        }
                    }
                }

                this.mapWindow.showInputText({
                    title: i18n.t('featuresamples.Create list') + '',
                    inputText: this.groupDefaultName,
                    description

                }).then(name => {
                    this.createGroup(name);
                }).catch(error => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('phrases.Object lists') + '. ' + i18n.tc('featuresamples.List creation error'),
                        description: i18n.tc('phrases.Object lists') + '. ' + error,
                        type: LogEventType.Error
                    });
                });
                break;
            case CREATE_GROUP_FROM_SEARCH_RESULT:

                this.mapWindow.showInputText({
                    title: i18n.t('featuresamples.Create list') + '',
                    inputText: this.groupDefaultName

                }).then(name => {
                    this.createGroupFromSearchResult(name);
                }).catch(error => {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('phrases.Object lists') + '. ' + i18n.tc('featuresamples.List creation error'),
                        description: i18n.tc('phrases.Object lists') + '. ' + error,
                        type: LogEventType.Error
                    });
                });
                break;
            case DELETE_GROUP:
                const deleteGroupId = value as number;
                const groupIndex = this.widgetProps.groupList.findIndex(group => group.id === deleteGroupId);
                if (groupIndex !== -1) {
                    this.widgetProps.groupList.splice(groupIndex, 1);
                    this.updateSearchGroupList();
                }

                const activeListIndex = this.widgetProps.activeListIndices.indexOf(deleteGroupId);
                if (activeListIndex !== -1) {
                    this.widgetProps.activeListIndices.splice(activeListIndex, 1);
                    this.map.requestRender();
                }

                const workspaceDataGroupIndex = this.workspaceData.groupList.findIndex(group => group.id === deleteGroupId);
                if (workspaceDataGroupIndex !== -1) {
                    this.workspaceData.groupList.splice(groupIndex, 1);
                    this.writeWorkspaceData(true);

                    const cachedGroupsIndex = this.cachedGroups.findIndex(group => group.id === deleteGroupId);
                    if (cachedGroupsIndex !== -1) {
                        this.cachedGroups.splice(cachedGroupsIndex, 1);
                    }
                }

                break;
            case TOGGLE_ITEM_GROUP:
                const clickOnItemValue = value as number;
                if (clickOnItemValue !== undefined) {
                    const activeListIndex = this.widgetProps.activeListIndices.indexOf(clickOnItemValue);
                    let showFlag = activeListIndex === -1;
                    if (!showFlag) {
                        this.widgetProps.activeListIndices.splice(activeListIndex, 1);
                    } else {
                        this.widgetProps.activeListIndices.push(clickOnItemValue);
                    }

                    const workspaceGroup = this.workspaceData.groupList.find(group => group.id === clickOnItemValue);
                    if (workspaceGroup) {
                        const errorLayers = new Set<string>;

                        let serviceLayer: ServiceWmsLayer | undefined;
                        for (const { xId } of workspaceGroup.layers) {
                            const vectorLayer = this.map.getVectorLayerByxId(xId);
                            if (vectorLayer) {
                                const url = vectorLayer.serviceUrl;

                                serviceLayer = this.viewServiceLayers.find(serviceLayer => serviceLayer.serviceUrl === url);
                                if (!serviceLayer) {
                                    serviceLayer = new ServiceWmsLayer(this.map, { alias: '', id: xId, url });
                                    this.viewServiceLayers.push(serviceLayer);
                                }
                                break;
                            }
                        }

                        if (serviceLayer) {
                            let layerGUIDlist = this.highlightedItemGUIDs.get(workspaceGroup.id);

                            if (!layerGUIDlist) {
                                layerGUIDlist = {};
                                this.highlightedItemGUIDs.set(workspaceGroup.id, layerGUIDlist);
                            }

                            if (!showFlag) {
                                const layerGUIDs = Object.values(layerGUIDlist);
                                layerGUIDs.forEach(layerGUID => {
                                    if (serviceLayer) {
                                        const layerIndex = serviceLayer.layers.findIndex(layer => layer.guid === layerGUID);
                                        if (layerIndex !== -1) {
                                            serviceLayer.layers.splice(layerIndex, 1);
                                        }
                                    }
                                });
                            } else {
                                for (const { xId, objectItems } of workspaceGroup.layers) {
                                    const vectorLayer = this.map.getVectorLayerByxId(xId);
                                    if (vectorLayer) {
                                        let layerGUID = layerGUIDlist[vectorLayer.idLayer];
                                        if (!layerGUID) {
                                            layerGUID = Utils.generateGUID();
                                            layerGUIDlist[vectorLayer.idLayer] = layerGUID;
                                        }
                                        serviceLayer.addLayer({
                                            id: vectorLayer.idLayer,
                                            objectIds: objectItems.map(item => item.gmlId),
                                            color: this.palette[this.workspaceData.groupList.findIndex(group => group.id === clickOnItemValue)].stroke.substring(1)
                                        }, layerGUID);
                                    } else {
                                        errorLayers.add(xId);
                                    }
                                }
                            }
                            serviceLayer?.forceUpdate();
                        } else {
                            workspaceGroup.layers.forEach(layer => errorLayers.add(layer.xId));
                        }


                        if (errorLayers.size !== 0) {
                            if (workspaceGroup.layers.length === errorLayers.size) {
                                const activeListIndex = this.widgetProps.activeListIndices.indexOf(clickOnItemValue);
                                if (activeListIndex !== -1) {
                                    this.widgetProps.activeListIndices.splice(activeListIndex, 1);
                                }
                            }

                            this.map.writeProtocolMessage({
                                display: true,
                                text: i18n.tc('featuresamples.Map layers missing'),
                                description: i18n.tc('phrases.Object lists') + '. ' + i18n.tc('featuresamples.The following layers from the selected list are missing') + ': ' + Array.from(errorLayers).join(', '),
                                type: LogEventType.Error
                            });
                        }
                    }
                }

                break;
            case SHOW_ITEM_LIST:
                this.map.clearSelectedObjects();
                this.getCachedGroup(value as number).then(cachedGroup => {
                    let errorDescription;
                    if (cachedGroup) {
                        const objects: MapObject[] = [];
                        const errorLayers = new Set<string>();
                        if (cachedGroup.layers.length !== 0) {
                            cachedGroup.layers.forEach(layer => {
                                if (this.map.getVectorLayerByxId(layer.xId)) {
                                    layer.objects.forEach(mapObject => objects.push(mapObject));
                                } else {
                                    errorLayers.add(layer.xId);
                                }
                            });
                            if (errorLayers.size !== 0) {
                                errorDescription = i18n.tc('featuresamples.The following layers from the selected list are missing') + ': ' + Array.from(errorLayers).join(', ');
                            }
                        } else {
                            errorDescription = i18n.tc('featuresamples.All layers from the selected list are missing');
                        }
                        this.map.addSelectedObjects(objects);
                        this.mapWindow.getTaskManager().showObjectPanel(MapObjectPanelState.showSelectedObjects);
                    } else {
                        errorDescription = i18n.tc('featuresamples.All layers from the selected list are missing');
                    }

                    if (errorDescription) {
                        this.map.writeProtocolMessage({
                            display: true,
                            text: i18n.tc('featuresamples.Map layers missing'),
                            description: i18n.tc('phrases.Object lists') + '. ' + errorDescription,
                            type: LogEventType.Error
                        });
                    }
                });
                break;
            case SELECT_ITEM_LIST:
                this.getCachedGroup(value as number).then(cachedGroup => {
                    if (cachedGroup) {
                        const selectObjects: MapObject[] = [];
                        cachedGroup.layers.map(layer => selectObjects.push(...layer.objects));
                        this.map.addSelectedObjects(selectObjects);
                        const count = selectObjects.length;
                        this.mapWindow.addSnackBarMessage(i18n.t('phrases.Highlighted objects') + ': ' + count);
                    }
                });
                break;

            //search
            case SET_SEARCH_FIRST_ITEM_ID:
                this.widgetProps.searchProps.firstSearchItemId = value as number;
                this.updateSearchGroupList();
                break;
            case SET_SEARCH_SECOND_ITEM_ID:
                this.widgetProps.searchProps.secondSearchItemId = value as number;
                this.updateSearchGroupList();
                break;
            case SET_SEARCH_OPERATORS:
                this.widgetProps.searchProps.selectedOperators.splice(0);
                (value as Operator[]).forEach(operator => this.widgetProps.searchProps.selectedOperators.push(operator));
                this.percentCompleted.splice(0);
                this.updateSearchProgress();
                break;
            case SET_LAYER_NAME:
                if (this.widgetProps.searchProps.searchResult) {
                    this.widgetProps.searchProps.searchResult.layer.alias = value as string;
                }
                this.workspaceData.names.layerName = value as string;
                this.writeWorkspaceData(true);
                break;
            case SET_FILE_NAME:
                if (this.widgetProps.searchProps.searchResult?.file) {
                    this.widgetProps.searchProps.searchResult.file.fileName = value as string;
                }
                this.workspaceData.names.fileName = value as string;
                this.writeWorkspaceData(true);
                break;
            case RUN_SEARCH:
                this.cleanResult();

                const mapObjectList = this.workspaceData.groupList.find(group => group.id === this.widgetProps.searchProps.firstSearchItemId);
                const templateMapObjectList = this.workspaceData.groupList.find(group => group.id === this.widgetProps.searchProps.secondSearchItemId);

                if (templateMapObjectList && templateMapObjectList.layers.length > 0 && mapObjectList && mapObjectList.layers.length > 0) {

                    this.totalRequests = mapObjectList.layers.length;

                    mapObjectList.layers.forEach(mapObjectLayerParams => {

                        const mapObjectLayer = this.map.getVectorLayerByxId(mapObjectLayerParams.xId);

                        if (!mapObjectLayer) {
                            return;
                        }

                        const url = mapObjectLayer.serviceUrl;

                        // const service = RequestServices.getService(url, ServiceType.REST);
                        // const httpParams = RequestServices.createHttpParams(this.map, { url });

                        if (this.widgetProps.searchProps.typeOfSearch === TypeOfSearch.Cross) {
                            const options: CheckCrossByLayersIncludePointsParams[] = [];

                            const commonParams = this.getCommonParams(TypeOfSearch.Cross);
                            options.push(commonParams);

                            const firstParams = this.getFirstRequestParams(mapObjectLayerParams);
                            if (firstParams) {
                                options.push(firstParams);
                            }

                            const layerParams = this.getSecondRequestParams(templateMapObjectList);
                            options.push(...layerParams);

                            if (options.length < 3) {
                                return;
                            }

                            const requestData: RequestData = { type: TypeOfSearch.Cross, params: options };
                            this.sendSearchRequest(mapObjectLayerParams.xId, url, requestData);

                        } else if (this.widgetProps.searchProps.typeOfSearch === TypeOfSearch.Distance) {
                            const options: CheckDistanceByLayers[] = [];

                            const commonParams = this.getCommonParams(TypeOfSearch.Distance);
                            options.push(commonParams);

                            const firstParams = this.getFirstRequestParams(mapObjectLayerParams);
                            if (firstParams) {
                                options.push(firstParams);
                            }

                            const layerParams = this.getSecondRequestParams(templateMapObjectList);
                            options.push(...layerParams);

                            if (options.length < 3) {
                                return;
                            }

                            const requestData: RequestData = { type: TypeOfSearch.Distance, params: options };
                            this.sendSearchRequest(mapObjectLayerParams.xId, url, requestData);

                        } else if (this.widgetProps.searchProps.typeOfSearch === TypeOfSearch.Start) {
                            const options: CheckFromStartByLayers[] = [];

                            const commonParams = this.getCommonParams(TypeOfSearch.Start);
                            options.push(commonParams);

                            const firstParams = this.getFirstRequestParams(mapObjectLayerParams);
                            if (firstParams) {
                                options.push(firstParams);
                            }

                            const layerParams = this.getSecondRequestParams(templateMapObjectList);
                            options.push(...layerParams);

                            if (options.length < 3) {
                                return;
                            }

                            const requestData: RequestData = { type: TypeOfSearch.Start, params: options };
                            this.sendSearchRequest(mapObjectLayerParams.xId, url, requestData);

                        } else if (this.widgetProps.searchProps.typeOfSearch === TypeOfSearch.End) {
                            const options: CheckFromEndByLayers[] = [];

                            const commonParams = this.getCommonParams(TypeOfSearch.End);
                            options.push(commonParams);

                            const firstParams = this.getFirstRequestParams(mapObjectLayerParams);
                            if (firstParams) {
                                options.push(firstParams);
                            }

                            const layerParams = this.getSecondRequestParams(templateMapObjectList);
                            options.push(...layerParams);

                            if (options.length < 3) {
                                return;
                            }

                            const requestData: RequestData = { type: TypeOfSearch.End, params: options };
                            this.sendSearchRequest(mapObjectLayerParams.xId, url, requestData);
                        }
                    });
                }
                break;
            case ABORT_SEARCH:
                for (const abortItem of this.abortXhr) {
                    abortItem.abort();
                }
                this.abortXhr.splice(0);

                this.cleanResult();
                break;
            case TOGGLE_LAYER_VISIBILITY:

                if (this.widgetProps.searchProps.searchResult) {
                    if (this.serviceLayer) {
                        if (this.serviceLayer.visible) {
                            this.serviceLayer.hide();
                        } else {
                            this.serviceLayer.show();
                        }
                        this.widgetProps.searchProps.searchResult.layer.visible = this.serviceLayer.visible;
                        this.map.redraw();
                    }
                }

                break;
            case DOWNLOAD_LAYER:
                if (this.serviceLayer) {
                    const fileName = this.workspaceData.names.layerName + '.json';
                    this.serviceLayer.download({ outType: OUTTYPE.JSON }).then(blob => {
                        if (blob) {
                            try {
                                BrowserService.downloadContent(blob, fileName);
                            } catch (error) {
                                this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
                            }
                            
                        }
                    });
                }
                break;
            case DOWNLOAD_FILE:
                if (this.widgetProps.searchProps.searchResult?.file) {
                    const file = this.widgetProps.searchProps.searchResult.file;
                    this.widgetProps.searchProps.csvCreation = true;
                    this.prepareCSV()
                        .then(blob => {
                            if (blob) {
                                try {
                                    BrowserService.downloadContent(blob, file.fileName + '.csv');
                                } catch (error) {
                                    this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
                                }
                                
                            }
                        })
                        .finally(() => this.widgetProps.searchProps.csvCreation = false);
                }
                break;
            case SET_TYPE_OF_SEARCH:
                this.widgetProps.searchProps.typeOfSearch = value as number;
                break;

            case SET_LENGTH_UNIT:
                this.widgetProps.searchProps.searchLengthUnit = value as Unit;
                break;

            case SET_CONDITION_OPERATOR_ID:
                this.widgetProps.searchProps.conditionOperatorId = value as Condition;
                break;

            case SET_DISTANCE_VALUE:
                this.widgetProps.searchProps.distanceValue = value as string;
                break;
        }
    }

    /**
     * Формирование общих параметров поиска
     * @private
     * @method getCommonParams
     * @param typeOfSearch {number} Тип поиска
     * @return {object} Объект с параметрами
     */
    getCommonParams(typeOfSearch: TypeOfSearch.Cross): CheckCrossByLayersIncludePointsParams;
    getCommonParams(typeOfSearch: TypeOfSearch.Distance): CheckDistanceByLayers;
    getCommonParams(typeOfSearch: TypeOfSearch.Start): CheckFromStartByLayers;
    getCommonParams(typeOfSearch: TypeOfSearch.End): CheckFromEndByLayers;
    getCommonParams(typeOfSearch: TypeOfSearch): CheckCrossByLayersIncludePointsParams | CheckDistanceByLayers | CheckFromStartByLayers | CheckFromEndByLayers {
        const LAYER = '', IDINOBJECTLIST = undefined;
        switch (typeOfSearch) {
            case TypeOfSearch.Cross:
                return { LAYER };
            case TypeOfSearch.Distance:
                let DISTANCE = this.widgetProps.searchProps.distanceValue;
                if (this.widgetProps.searchProps.searchLengthUnit === Unit.Kilometers) {
                    DISTANCE = '' + Number(DISTANCE) * 1000;
                }
                const CONDITION = this.widgetProps.searchProps.conditionOperatorId;
                return { LAYER, DISTANCE, CONDITION, IDINOBJECTLIST };
            case TypeOfSearch.Start:
            case TypeOfSearch.End:
                return { LAYER, IDINOBJECTLIST };
        }
    }

    /**
     * Формирование первичных параметров поиска
     * @private
     * @method getFirstRequestParams
     * @param params {StoredLayerItem} Параметры слоя
     * @return {LayerParams | undefined } Объект с параметрами
     */
    private getFirstRequestParams(params: StoredLayerItem): LayerParams | undefined {
        const vectorLayer = this.map.getVectorLayerByxId(params.xId);
        if (vectorLayer) {
            const LAYER = vectorLayer.idLayer;
            return {
                LAYER,
                IDINOBJECTLIST: ObjectListNumber.First,
                IDLIST: params.objectItems.map(item => item.gmlId).join(',')
            };
        }
    }

    /**
     * Получение параметров слоя
     * @private
     * @method getSecondRequestParams
     * @param templateMapObjectList {StoredGroup} шаблон списка объектов карты
     * @return {LayerParams[]} Объект с параметрами слоя
     */

    private getSecondRequestParams(templateMapObjectList: StoredGroup): LayerParams[] {
        const options: LayerParams[] = [];

        this.requestIdListMap.clear();

        templateMapObjectList.layers.forEach(layerItem => {
            const vectorLayer = this.map.getVectorLayerByxId(layerItem.xId);
            if (vectorLayer) {
                const requestIdList = layerItem.objectItems.map(item => item.gmlId);

                const LAYER = vectorLayer.idLayer;
                const IDLIST = requestIdList.join(',');
                const IDINOBJECTLIST = ObjectListNumber.Second;
                const layerParams = { LAYER, IDLIST, IDINOBJECTLIST };
                options.push(layerParams);

                this.requestIdListMap.set(LAYER, requestIdList);
            }
        });

        return options;
    }

    /**
     * Отправление поискового запроса
     * @private
     * @method sendSearchRequest
     * @param layerXId {string} Идентификатор слоя
     * @param url {StoredGroup} Адрес сервера
     * @param requestData {RequestData} Данные с поисковым запросом
     */

    private sendSearchRequest(layerXId: string, url: string, requestData: RequestData) {
        const service = RequestServices.getService(url, ServiceType.REST);
        const httpParams = RequestServices.createHttpParams(this.map, { url });
        let request, cancellableRequest;

        if (requestData.type === TypeOfSearch.Cross) {
            request = service.checkCrossByLayersIncludePoints.bind(service);
            cancellableRequest = RequestService.sendCancellableRequest(request, requestData.params, httpParams);
        } else if (requestData.type === TypeOfSearch.Distance) {
            request = service.checkDistanceByLayers.bind(service);
            cancellableRequest = RequestService.sendCancellableRequest(request, requestData.params, httpParams);
        } else if (requestData.type === TypeOfSearch.Start) {
            request = service.checkFromStartByLayers.bind(service);
            cancellableRequest = RequestService.sendCancellableRequest(request, requestData.params, httpParams);
        } else if (requestData.type === TypeOfSearch.End) {
            request = service.checkFromEndByLayers.bind(service);
            cancellableRequest = RequestService.sendCancellableRequest(request, requestData.params, httpParams);
        } else {
            return false;
        }

        this.addAbortItem(layerXId, cancellableRequest.abortXhr);

        this.percentCompleted.push({ id: layerXId, value: 0 });

        this.updateSearchProgress();

        cancellableRequest.promise
            .then(response => {
                let processId: string | undefined = undefined;
                if (response.data) {
                    const status = response.data.restmethod.outparams.status;
                    if (status === 'Accepted') {
                        processId = response.data.restmethod.outparams.jobId;
                    }
                }
                if (processId !== undefined) {
                    this.getStatusResponse(processId, url, layerXId);
                } else {
                    this.removeAbortItem(layerXId);
                }
            })
            .catch((error) => {
                this.map.writeProtocolMessage({
                    text: i18n.tc('phrases.Error when executing query'),
                    display: true,
                    description: error,
                    type: LogEventType.Error
                });
                this.removeAbortItem(layerXId);
                const progressItemIndex = this.percentCompleted.findIndex(item => item.id === layerXId);
                if (progressItemIndex !== -1) {
                    this.percentCompleted.splice(progressItemIndex, 1);
                    this.updateSearchProgress();
                }
            });
    }

    private getAbortItem(id: string) {
        return this.abortXhr.find(item => item.id === id);
    }

    private removeAbortItem(id: string) {
        const index = this.abortXhr.findIndex(item => item.id === id);
        this.abortXhr.splice(index, 1);
    }

    private addAbortItem(id: string, func: () => void) {
        const abortItem = this.abortXhr.find(item => item.id === id);
        if (abortItem) {
            abortItem.abort = func;
        } else {
            this.abortXhr.push({ id, abort: func });
        }
    }

    /**
     * Обновить список групп для операции поиска
     * @private
     * @method updateSearchGroupList
     */
    private updateSearchGroupList(): void {
        this.widgetProps.searchProps.searchFirstItemGroupList.splice(0);
        this.widgetProps.searchProps.searchSecondItemGroupList.splice(0);

        let serviceFilter: string | undefined = undefined;

        const group = this.workspaceData.groupList.find(group => group.id === this.widgetProps.searchProps.firstSearchItemId);
        if (group && group.layers.length > 0) {
            const layer = this.map.getVectorLayerByxId(group.layers[0].xId);
            if (layer) {
                serviceFilter = layer.serviceUrl;
            }
        }

        if (!serviceFilter) {
            const group = this.workspaceData.groupList.find(group => group.id === this.widgetProps.searchProps.secondSearchItemId);
            if (group && group.layers.length > 0) {
                const layer = this.map.getVectorLayerByxId(group.layers[0].xId);
                if (layer) {
                    serviceFilter = layer.serviceUrl;
                }
            }
        }


        this.workspaceData.groupList.forEach(group => {

            let rejectFlag = false;
            if (serviceFilter !== undefined) {
                for (let i = 0; i < group.layers.length; i++) {
                    const layer = this.map.getVectorLayerByxId(group.layers[i].xId);
                    if (!layer || layer.serviceUrl !== serviceFilter) {
                        rejectFlag = true;
                        break;
                    }
                }
            }

            if (!rejectFlag) {
                const item = this.widgetProps.groupList.find(widgetGroup => widgetGroup.id === group.id);

                if (item) {
                    if (item.id !== this.widgetProps.searchProps.secondSearchItemId) {
                        this.widgetProps.searchProps.searchFirstItemGroupList.push(item);
                    }

                    if (item.id !== this.widgetProps.searchProps.firstSearchItemId) {
                        this.widgetProps.searchProps.searchSecondItemGroupList.push(item);
                    }
                }
            }
        });

        this.percentCompleted.splice(0);
        this.updateSearchProgress();
    }

    /**
     * Получить группу объектов (с кешированием)
     * @private
     * @async
     * @method getCachedGroup
     * @return {Group | undefined} Группа объектов разбитая по слоям
     */
    private async getCachedGroup(groupId: number): Promise<Group | undefined> {
        let cachedGroup;
        const workspaceGroup = this.workspaceData.groupList.find(group => group.id === groupId);
        if (workspaceGroup) {
            cachedGroup = this.cachedGroups.find(group => group.id === groupId);

            if (!cachedGroup) {
                const layers: LayerItem[] = [];
                for (const { xId, objectItems } of workspaceGroup.layers) {

                    let layerItem = layers.find(item => item.xId === xId);
                    if (!layerItem) {
                        layerItem = { xId, objects: [] };
                        layers.push(layerItem);
                    }

                    const vectorLayer = this.map.getVectorLayerByxId(xId);
                    if (vectorLayer) {
                        const idList = new Set<string>();
                        for (const { gmlId } of objectItems) {
                            idList.add(gmlId);
                        }

                        const requestService = RequestServices.retrieveOrCreate({ url: vectorLayer.serviceUrl }, ServiceType.REST);
                        const response = await requestService.getFeature([{
                            LAYER: vectorLayer.idLayer,
                            GETEMPTYCLUSTEROBJECT: '0',
                            AREA: '1',
                            GETFRAME: GETFRAME.AddObjectBounds,
                            IDLIST: Array.from(idList).join(','),
                            OUTTYPE: OUTTYPE.JSON,
                            OUTCRS: this.map.getCrsString(),
                            METRIC: METRIC.RemoveMetric
                        }]);
                        if (response) {
                            const geoJSON = new GeoJSON(response.data);
                            for (let i = 0; i < geoJSON.featureCollection.getFeatureCount(); i++) {
                                const featureResponse = geoJSON.featureCollection.getFeature(i)?.toJSON();
                                if (featureResponse) {
                                    layerItem.objects.push(MapObject.fromJSON(vectorLayer, featureResponse));
                                }
                            }
                        }
                    }
                }

                cachedGroup = { id: workspaceGroup.id, layers };
                this.cachedGroups.push(cachedGroup);
            }
        }
        return cachedGroup;
    }

    /**
     * Подготовить Blob для скачивания CSV
     * @private
     * @async
     * @method prepareCSV
     * @return {Blob | undefined} Blob для скачивания
     */
    private async prepareCSV(): Promise<Blob | undefined> {

        if (!this.result) {
            return;
        }

        const csv = new CsvEditor('', '', true);
        csv.separator = ColumnSeparator.Semicolon;
        csv.lineBreak = '\r\n';
        csv.columnCount = 8;
        csv.clearTitle();
        csv.addTitleCells([
            { col: 0, row: 0, value: '#', type: 'String' },
            { col: 1, row: 0, value: i18n.tc('featuresamples.First list object id'), type: 'String' },
            { col: 2, row: 0, value: i18n.tc('featuresamples.First list object name'), type: 'String' },
            { col: 3, row: 0, value: i18n.tc('featuresamples.First list object layer name'), type: 'String' },
            { col: 4, row: 0, value: i18n.tc('featuresamples.Relation'), type: 'String' },
            { col: 5, row: 0, value: i18n.tc('featuresamples.Second list object id'), type: 'String' },
            { col: 6, row: 0, value: i18n.tc('featuresamples.Second list object name'), type: 'String' },
            { col: 7, row: 0, value: i18n.tc('featuresamples.Second list object layer name'), type: 'String' },
        ]);

        const mapObjectlayerXId = Reflect.ownKeys(this.result)[0] as string;

        const vectorLayer = this.map.getVectorLayerByxId(mapObjectlayerXId || '');


        if (vectorLayer) {
            const url = vectorLayer.serviceUrl;

            const options: GetFeatureParams[] = [{
                LAYER: '',
                OUTTYPE: OUTTYPE.JSON,
                OUTCRS: this.map.getCrsString()
            }];

            const items: { [key: string]: Set<string> } = {};

            for (const layerXId in this.result) {
                const mapObjectLayer = this.map.getVectorLayerByxId(layerXId);
                if (mapObjectLayer) {
                    const mapObjectIdSet = new Set<string>();
                    items[mapObjectLayer.idLayer] = mapObjectIdSet;
                    for (const mapObjectGmlId in this.result[layerXId]) {
                        if (Reflect.ownKeys(this.result[layerXId][mapObjectGmlId]).length > 0) {
                            mapObjectIdSet.add(mapObjectGmlId);
                            const crossResult = this.result[layerXId][mapObjectGmlId];
                            let crossResultType: CrossResultOperators;
                            for (crossResultType in crossResult) {
                                const layerItems = crossResult[crossResultType];
                                if (layerItems) {
                                    layerItems.forEach(layerItem => {
                                        let idSet = items[layerItem.layer];
                                        if (!idSet) {
                                            idSet = new Set<string>();
                                            items[layerItem.layer] = idSet;
                                        }
                                        layerItem.idList.forEach(id => idSet.add(id));
                                    });
                                }
                            }
                        }
                    }

                    if (mapObjectIdSet.size === 0) {
                        delete items[mapObjectLayer.idLayer];
                    }
                }
            }

            for (const idLayer in items) {
                options.push({
                    LAYER: idLayer,
                    IDLIST: Array.from(items[idLayer]).join(',')
                });
            }

            const httpParams = RequestServices.createHttpParams(this.map, { url });

            const requestService = RequestServices.retrieveOrCreate(httpParams, ServiceType.REST);

            const response = await requestService.getFeature<GeoJsonType>(options, httpParams);

            const mapObjectMap = new Map<string, MapObject>();
            if (response) {
                if (response.data) {
                    const geoJson = response.data;

                    geoJson.features.forEach(feature => {
                        const vectorLayer = this.map.vectorLayers.find(layer => layer.serviceUrl === url && layer.idLayer === feature.properties.mapid);
                        if (vectorLayer) {
                            const mapObject = MapObject.fromJSON(vectorLayer, feature);
                            mapObjectMap.set(vectorLayer.idLayer + mapObject.gmlId, mapObject);
                        }
                    });

                }
            }

            for (const layerXId in this.result) {
                const mapObjectLayer = this.map.getVectorLayerByxId(layerXId);
                if (mapObjectLayer) {

                    for (const mapObjectGmlId in this.result[layerXId]) {
                        const crossResultList = this.result[layerXId][mapObjectGmlId];
                        const mapObject = mapObjectMap.get(mapObjectLayer.idLayer + mapObjectGmlId);
                        let crossResultType: CrossResultOperators;

                        this.widgetProps.searchProps.searchResult?.operators?.forEach(operator => {

                            for (crossResultType in crossResultList) {

                                let isSatisfy = false;

                                if (operator === Operator.Cross) {
                                    if (crossResultType === CROSSTYPE[CROSSTYPE.Cross]) {
                                        isSatisfy = true;
                                    }
                                }

                                if (operator === Operator.Touch) {
                                    if (crossResultType === CROSSTYPE[CROSSTYPE.CrossInsideList]
                                        || crossResultType === CROSSTYPE[CROSSTYPE.CrossOutSideList]) {
                                        isSatisfy = true;
                                    }
                                }

                                if (operator === Operator.Inside) {
                                    if (crossResultType === CROSSTYPE[CROSSTYPE.Inside]) {
                                        isSatisfy = true;
                                    }
                                }

                                if (operator === Operator.NotCross) {
                                    if ((crossResultType === CROSSTYPE[CROSSTYPE.NotCross]
                                            || crossResultType === CROSSTYPE[CROSSTYPE.Inside]
                                            || crossResultType === CROSSTYPE[CROSSTYPE.MainInside])
                                        && !(CROSSTYPE[CROSSTYPE.Cross] in crossResultList)
                                        && !(CROSSTYPE[CROSSTYPE.CrossInsideList] in crossResultList)
                                        && !(CROSSTYPE[CROSSTYPE.CrossOutSideList] in crossResultList)) {
                                        isSatisfy = true;
                                    }
                                }

                                if (operator === Operator.NotTouch) {
                                    if ((crossResultType === CROSSTYPE[CROSSTYPE.NotCross]
                                            || crossResultType === CROSSTYPE[CROSSTYPE.Inside]
                                            || crossResultType === CROSSTYPE[CROSSTYPE.MainInside])
                                        && !(CROSSTYPE[CROSSTYPE.Cross] in crossResultList)
                                        && !(CROSSTYPE[CROSSTYPE.CrossInsideList] in crossResultList)
                                        && !(CROSSTYPE[CROSSTYPE.CrossOutSideList] in crossResultList)) {
                                        isSatisfy = true;
                                    }
                                }

                                if (operator === Operator.Outside) {
                                    if ((crossResultType === CROSSTYPE[CROSSTYPE.NotCross]
                                            || crossResultType === CROSSTYPE[CROSSTYPE.CrossOutSideList])
                                        && !(CROSSTYPE[CROSSTYPE.Cross] in crossResultList)
                                        && !(CROSSTYPE[CROSSTYPE.Inside] in crossResultList)
                                        && !(CROSSTYPE[CROSSTYPE.MainInside] in crossResultList)
                                        && !(CROSSTYPE[CROSSTYPE.CrossInsideList] in crossResultList)) {
                                        isSatisfy = true;
                                    }
                                }

                                if (isSatisfy) {
                                    const layerItems = crossResultList[crossResultType];
                                    if (mapObject && layerItems) {
                                        layerItems.forEach(layerItem => {
                                            layerItem.idList.forEach(templateGmlId => {
                                                const key = layerItem.layer + templateGmlId;
                                                const templateMapObject = mapObjectMap.get(key);
                                                if (templateMapObject) {
                                                    const row = csv.rowCount;
                                                    csv.addCells([
                                                        { col: 0, row, value: row + 1 + '', type: 'Number' },
                                                        { col: 1, row, value: mapObjectGmlId, type: 'String' },
                                                        {
                                                            col: 2,
                                                            row,
                                                            value: Array.isArray(mapObject.title) ? mapObject.title.join(',') : mapObject.title || mapObject.objectName || 'Undefined',
                                                            type: 'String'
                                                        },
                                                        {
                                                            col: 3,
                                                            row,
                                                            value: mapObject.vectorLayer.alias,
                                                            type: 'String'
                                                        },
                                                        {
                                                            col: 4,
                                                            row,
                                                            value: this.getResultOperationName(crossResultType, operator),
                                                            type: 'String'
                                                        },
                                                        {
                                                            col: 5,
                                                            row,
                                                            value: templateGmlId,
                                                            type: 'String'
                                                        },
                                                        {
                                                            col: 6,
                                                            row,
                                                            value: Array.isArray(templateMapObject.title) ? templateMapObject.title.join(',') : templateMapObject.title || templateMapObject.objectName || 'Undefined',
                                                            type: 'String'
                                                        },
                                                        {
                                                            col: 7,
                                                            row,
                                                            value: templateMapObject.vectorLayer.alias,
                                                            type: 'String'
                                                        }
                                                    ]);
                                                }
                                            });
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            }

            return Utils.unicodeToWin1251Blob(csv.toString(true));
        }
    }

    /**
     * Очистить результат пересечения
     * @private
     * @method cleanResult
     */
    private cleanResult(): void {
        if (this.serviceLayer) {
            this.serviceLayer.destroy();
            this.serviceLayer = undefined;
        }

        for (const resultKey in this.result) {
            delete this.result[resultKey];
        }

        this.widgetProps.searchProps.searchResult = null;
        this.percentCompleted.splice(0);
        this.updateSearchProgress();
    }

    /**
     * Получить информацию о статусе асинхронного процесса
     * @private
     * @method getStatusResponse
     * @param processId {string} Идентификатор процесса
     * @param serviceUrl {string} URL адрес запроса
     * @param layerXId {string} Идентификатор слоя
     */
    private getStatusResponse(processId: string, serviceUrl: string, layerXId: string) {

        window.setTimeout(async () => {
            if (!this.getAbortItem(layerXId)) {
                return;
            }
            const service = RequestServices.getService(serviceUrl, ServiceType.REST);
            const request = service.getAsyncStatusData.bind(service) as () => Promise<ServiceResponse<GetStatusDataResponse>>;
            const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
            this.addAbortItem(layerXId, cancellableRequest.abortXhr);
            try {
                const response = await cancellableRequest.promise;
                if (response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;
                    if (statusMessage === 'Accepted' || statusMessage === 'Running') {
                        const progressItem = this.percentCompleted.find(item => item.id === layerXId);
                        if (progressItem) {
                            progressItem.value = response.data.restmethod.outparams.percentCompleted;
                            this.updateSearchProgress();
                        }
                        return this.getStatusResponse(processId, serviceUrl, layerXId);
                    } else if (statusMessage === 'Succeeded') {
                        const progressItem = this.percentCompleted.find(item => item.id === layerXId);
                        if (progressItem) {
                            progressItem.value = 100;
                            this.updateSearchProgress();
                        }
                        processId = response.data.restmethod.outparams.jobId;
                    }
                }
                if (processId !== undefined && response.data) {
                    const statusMessage = response.data.restmethod.outparams.status;
                    this.processResponse(processId, serviceUrl, layerXId, statusMessage);
                } else {
                    this.removeAbortItem(layerXId);
                }

            } catch (error) {
                const gwtkError = new GwtkError(error);
                this.map.writeProtocolMessage({
                    text: i18n.tc('phrases.Error when executing query'),
                    display: true,
                    description: gwtkError.message,
                    type: LogEventType.Error
                });
                this.removeAbortItem(layerXId);
                if (this.abortXhr.length === 0) {
                    this.percentCompleted.splice(0);
                } else {
                    const progressItem = this.percentCompleted.find(item => item.id === layerXId);
                    if (progressItem) {
                        progressItem.value = 100;
                    }
                }
                this.updateSearchProgress();
            }

        }, 1000);
    }

    private updateSearchProgress() {
        if (this.percentCompleted.length > 0) {
            let value = 0;
            this.percentCompleted.forEach(item => value += item.value);
            this.widgetProps.searchProps.searchProgress = value / this.percentCompleted.length;
        } else {
            this.widgetProps.searchProps.searchProgress = null;
        }
    }

    /**
     * Обработать промежуточный этап поиска
     * @private
     * @method processResponse
     */
    private processResponse(processId: string, serviceUrl: string, layerXId: string, statusMessage: string): void {

        const service = RequestServices.getService(serviceUrl, ServiceType.REST);

        if (!this.getAbortItem(layerXId)) {
            return;
        }

        const request = service.getAsyncResultData.bind(service) as () => Promise<ServiceResponse<CheckDistanceByLayersIncludePointsResponse | CheckCrossByLayersIncludePointsResponse | ErrorResponse | GetRequestDataResponse>>;
        const cancellableRequest = RequestService.sendCancellableRequest(request, { PROCESSNUMBER: processId });
        this.addAbortItem(layerXId, cancellableRequest.abortXhr);
        cancellableRequest.promise.then(result => {
            this.totalRequests--;
            this.removeAbortItem(layerXId);
            if (statusMessage === 'Failed') {
                if (result.error && typeof result.error !== 'string' && this.totalRequests === 0) {
                    this.mapWindow.addSnackBarMessage(i18n.tc('phrases.Objects with this properties not found'));
                    this.map.writeProtocolMessage({
                        text: result.error.ExceptionReport.text,
                        display: false,
                        type: LogEventType.Error
                    });
                }

            } else {

                if (this.widgetProps.searchProps.typeOfSearch === TypeOfSearch.Cross) {

                    const data = result.data as CheckCrossByLayersIncludePointsResponse;

                    const outParamsFiltered: CheckCrossByLayersIncludePointsResponse['restmethod']['outparams'] = {};

                    for (const outParamsKey_object in data.restmethod.outparams) {
                        const dataItem = data.restmethod.outparams[outParamsKey_object];

                        if (this.widgetProps.searchProps.selectedOperators.includes(Operator.Cross)) {
                            if (CROSSTYPE[CROSSTYPE.Cross] in dataItem) {
                                outParamsFiltered[outParamsKey_object] = data.restmethod.outparams[outParamsKey_object];
                            }
                        }

                        if (this.widgetProps.searchProps.selectedOperators.includes(Operator.Inside)) {
                            if (CROSSTYPE[CROSSTYPE.Inside] in dataItem) {
                                outParamsFiltered[outParamsKey_object] = data.restmethod.outparams[outParamsKey_object];
                            }
                        }

                        if (this.widgetProps.searchProps.selectedOperators.includes(Operator.NotCross)) {
                            if ((CROSSTYPE[CROSSTYPE.NotCross] in dataItem
                                    || CROSSTYPE[CROSSTYPE.Inside] in dataItem
                                    || CROSSTYPE[CROSSTYPE.MainInside] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.Cross] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.CrossInsideList] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.CrossOutSideList] in dataItem)
                            ) {
                                outParamsFiltered[outParamsKey_object] = data.restmethod.outparams[outParamsKey_object];
                            }
                        }

                        if (this.widgetProps.searchProps.selectedOperators.includes(Operator.NotTouch)) {
                            if ((CROSSTYPE[CROSSTYPE.NotCross] in dataItem
                                    || CROSSTYPE[CROSSTYPE.Inside] in dataItem
                                    || CROSSTYPE[CROSSTYPE.MainInside] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.Cross] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.CrossInsideList] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.CrossOutSideList] in dataItem)
                            ) {
                                outParamsFiltered[outParamsKey_object] = data.restmethod.outparams[outParamsKey_object];
                            }
                        }

                        if (this.widgetProps.searchProps.selectedOperators.includes(Operator.Touch)) {
                            if (CROSSTYPE[CROSSTYPE.CrossInsideList] in dataItem
                                || CROSSTYPE[CROSSTYPE.CrossOutSideList] in dataItem) {
                                outParamsFiltered[outParamsKey_object] = data.restmethod.outparams[outParamsKey_object];
                            }
                        }

                        if (this.widgetProps.searchProps.selectedOperators.includes(Operator.Outside)) {
                            if ((CROSSTYPE[CROSSTYPE.NotCross] in dataItem
                                    || CROSSTYPE[CROSSTYPE.CrossOutSideList] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.MainInside] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.Cross] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.CrossInsideList] in dataItem)
                                && !(CROSSTYPE[CROSSTYPE.Inside] in dataItem)
                            ) {
                                outParamsFiltered[outParamsKey_object] = data.restmethod.outparams[outParamsKey_object];
                            }
                        }

                    }

                    data.restmethod.outparams = outParamsFiltered;

                    this.handleResultByCross(data, layerXId);
                } else {
                    this.handleResultByDistanceStartEnd(result.data as CheckDistanceByLayersIncludePointsResponse, layerXId);
                }
            }

            const progressItemIndex = this.percentCompleted.findIndex(item => item.id === layerXId);
            if (progressItemIndex !== -1) {
                this.percentCompleted.splice(progressItemIndex, 1);
                this.updateSearchProgress();
            }
        }).catch((error) => {
            this.map.writeProtocolMessage({
                text: i18n.tc('phrases.Error when executing query'),
                display: true,
                description: error,
                type: LogEventType.Error
            });
            this.removeAbortItem(layerXId);

            const progressItemIndex = this.percentCompleted.findIndex(item => item.id === layerXId);
            if (progressItemIndex !== -1) {
                this.percentCompleted.splice(progressItemIndex, 1);
                this.updateSearchProgress();
            }
        });
    }

    /**
     * Обработчик готового результата пересечения
     * @private
     * @async
     * @method handleResultByCross
     */
    private async handleResultByCross(response: CheckCrossByLayersIncludePointsResponse, layerXId: string): Promise<void> {
        if (!this.result) {
            this.result = {};
        }
        this.result[layerXId] = response.restmethod.outparams;
        let xId = Utils.generateGUID();
        let alias = this.workspaceData.names.layerName;

        const vectorLayer = this.map.getVectorLayerByxId(layerXId);
        if (vectorLayer) {

            const objectIds = [];
            for (const mapObjectGmlId in this.result[layerXId]) {
                if (Reflect.ownKeys(this.result[layerXId][mapObjectGmlId]).length > 0) {
                    objectIds.push(mapObjectGmlId);
                }
            }
            if (objectIds.length > 0) {
                const url = vectorLayer.serviceUrl;

                if (!this.serviceLayer) {
                    this.serviceLayer = new ServiceWmsLayer(this.map, {
                        alias,
                        id: xId,
                        url
                    });
                } else {
                    xId = this.serviceLayer.xId;
                    alias = this.serviceLayer.alias;
                }

                this.serviceLayer.addLayer({
                    id: vectorLayer.idLayer,
                    objectIds
                });

                this.serviceLayer.forceUpdate();
            }
        }

        if (this.abortXhr.length === 0) {
            const file = {
                id: xId,
                fileName: this.workspaceData.names.fileName
            };

            let totalObjectsCount = 0;
            for (const layerXId in this.result) {
                const mapObjectLayer = this.map.getVectorLayerByxId(layerXId);
                if (mapObjectLayer) {
                    for (const mapObjectGmlId in this.result[layerXId]) {
                        if (Reflect.ownKeys(this.result[layerXId][mapObjectGmlId]).length > 0) {
                            totalObjectsCount++;
                        }
                    }
                }
            }

            const layer = { xId, alias, visible: true };
            this.widgetProps.searchProps.searchResult = {
                layer,
                file,
                operators: this.widgetProps.searchProps.selectedOperators.slice(),
                totalObjectsCount
            };
        }
    }

    /**
     * Обработчик готового результата по расстоянию
     * @private
     * @async
     * @method handleResultByDistanceStartEnd
     */
    private async handleResultByDistanceStartEnd(response: CheckDistanceByLayersIncludePointsResponse, layerXId: string): Promise<void> {
        if (!this.resultDistance) {
            this.resultDistance = {};
        }

        this.resultDistance[layerXId] = response;
        let xId = Utils.generateGUID();
        let alias = this.workspaceData.names.layerName;

        const vectorLayer = this.map.getVectorLayerByxId(layerXId);
        if (vectorLayer) {

            const objectIds: string[] = [];
            this.resultDistance[layerXId].features.forEach((features) => {
                objectIds.push(features.properties.id);
            });
            if (objectIds.length > 0) {
                const url = vectorLayer.serviceUrl;
                if (!this.serviceLayer) {
                    this.serviceLayer = new ServiceWmsLayer(this.map, {
                        alias,
                        id: xId,
                        url
                    });
                } else {
                    xId = this.serviceLayer.xId;
                    alias = this.serviceLayer.alias;
                }
                this.serviceLayer.addLayer({
                    id: vectorLayer.idLayer,
                    objectIds
                });

                this.serviceLayer.forceUpdate();

            }

        }
        if (this.abortXhr.length === 0) {

            let totalObjectsCount = response.features.length;
            const layer = { xId, alias, visible: true };

            this.widgetProps.searchProps.searchResult = {
                layer,
                totalObjectsCount
            };
        }
    }

    /**
     * Создать список из выделенных объектов
     * @private
     * @async
     * @method createGroup
     */
    private async createGroup(name: string): Promise<void> {
        const mapObjects = this.map.getSelectedObjects().filter(mapObject => mapObject.vectorLayer instanceof GISWebServiceVectorLayer);
        const storedLayerObjectsList: StoredLayerItem[] = [];

        const layerList = new Set<VectorLayer>();
        const withoutGeometryList = mapObjects.filter(mapObject => {
            if (!mapObject.hasGeometry()) {
                if (!layerList.has(mapObject.vectorLayer)) {
                    layerList.add(mapObject.vectorLayer);
                    mapObject.vectorLayer.startTransaction();
                }
                return true;
            }
        });

        withoutGeometryList.forEach(mapObject => mapObject.reload());

        for (const vectorLayer of layerList) {
            await vectorLayer.reloadTransaction({ geometry: true });
        }

        for (let i = 0; i < mapObjects.length; i++) {
            const mapObject = mapObjects[i];

            const layer = mapObject.vectorLayer;
            let storedLayerObjects = storedLayerObjectsList.find(storedLayerObject => storedLayerObject.xId === layer.xId);
            if (!storedLayerObjects) {
                storedLayerObjects = {
                    xId: layer.xId,
                    objectItems: []
                };
                storedLayerObjectsList.push(storedLayerObjects);
            }

            storedLayerObjects.objectItems.push({ gmlId: mapObject.gmlId });
        }

        this.appendGroup(name, storedLayerObjectsList);
    }

    /**
     * Создать список из результата пересечения
     * @private
     * @method createGroupFromSearchResult
     */
    private createGroupFromSearchResult(name: string): void {
        const storedLayerObjectsList: StoredLayerItem[] = [];

        if (this.widgetProps.searchProps.typeOfSearch === TypeOfSearch.Cross) {

            for (const layerXId in this.result) {
                const mapObjectLayer = this.map.getVectorLayerByxId(layerXId);
                if (mapObjectLayer) {
                    let storedLayerObjects = storedLayerObjectsList.find(storedLayerObject => storedLayerObject.xId === layerXId);
                    if (!storedLayerObjects) {
                        storedLayerObjects = {
                            xId: layerXId,
                            objectItems: []
                        };
                        storedLayerObjectsList.push(storedLayerObjects);
                    }
                    for (const mapObjectGmlId in this.result[layerXId]) {
                        if (Reflect.ownKeys(this.result[layerXId][mapObjectGmlId]).length > 0) {
                            storedLayerObjects.objectItems.push({ gmlId: mapObjectGmlId });
                        }
                    }
                }
            }
        } else {
            for (const layerXId in this.resultDistance) {
                const mapObjectLayer = this.map.getVectorLayerByxId(layerXId);
                if (mapObjectLayer) {
                    let storedLayerObjects = storedLayerObjectsList.find(storedLayerObject => storedLayerObject.xId === layerXId);
                    if (!storedLayerObjects) {
                        storedLayerObjects = {
                            xId: layerXId,
                            objectItems: []
                        };
                        this.resultDistance[layerXId].features.forEach((features) => {
                            storedLayerObjects?.objectItems.push({ gmlId: features.properties.id });
                        });
                        storedLayerObjectsList.push(storedLayerObjects);

                    }
                }
            }
        }

        this.appendGroup(name, storedLayerObjectsList);
    }

    /**
     * Добавить список
     * @private
     * @method appendGroup
     */
    private appendGroup(name: string, storedLayerObjectsList: StoredLayerItem[]): void {
        const id = this.groupId;

        const style = this.getListObjectStyle(this.widgetProps.groupList.length);
        this.widgetProps.groupList.push({
            id,
            name,
            image: style.marker?.markerDescription?.image || ''
        });

        this.workspaceData.groupList.push({ id, name, layers: storedLayerObjectsList });

        this.writeWorkspaceData(true);

        this.updateSearchGroupList();
    }

    /**
     * Получить стиль отображения списка объектов
     * @private
     * @method getListObjectStyle
     * @return {Style} Стиль списка
     */
    private getListObjectStyle(index: number): Style {

        while (index >= this.palette.length) {
            index -= this.palette.length;
        }

        const currentStyle = this.palette[index];

        const fill = currentStyle.fill;
        const stroke = currentStyle.stroke;
        const pathD = currentStyle.pathD;

        return new Style({
            stroke: new Stroke({
                color: stroke,
                width: '3px'
            }),
            fill: new Fill({
                color: fill,
                opacity: 0.1
            }),
            marker: new MarkerStyle({
                markerDescription: {
                    'refX': 20,
                    'refY': 32,
                    'width': 32,
                    'height': 32,
                    'image': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 38 38" width="38" height="38"><path stroke="${stroke}" stroke-width="6px" stroke-dasharray="none" stroke-opacity="0.85" fill="${fill}" fill-opacity="0.8" pointer-events="none" d="${pathD}"></path></svg>`
                }
            })
        });
    }


    /**
     * @deprecated
     * @private
     */
    private validateWorkspaceData(): void {

        let needRewrite = false;

        if (!this.workspaceData.names) {
            this.workspaceData.names = {
                layerName: i18n.tc('phrases.Result'),
                fileName: i18n.tc('phrases.Result')
            };
            needRewrite = true;
        }


        for (let i = 0; i < this.workspaceData.groupList.length; i++) {
            // 27/04/2023 уходим от GeoJSON
            let storedLayerObjectsList = (this.workspaceData.groupList[i] as unknown as { objects?: any[] }).objects;
            if (storedLayerObjectsList) {
                needRewrite = true;
                if (storedLayerObjectsList.length > 0 && Array.isArray(storedLayerObjectsList[0])) {
                    // 27/03/2023 - для устаревших форм хранения списков
                    storedLayerObjectsList = this.validateStoredItem(storedLayerObjectsList);
                }

                storedLayerObjectsList.forEach(objectList => {
                    const features = (objectList as unknown as { features?: FeatureType[]; }).features;
                    if (features) {
                        const objectItems: { gmlId: string; }[] = [];
                        features.forEach(feature => {
                            const gmlId = feature.properties.id;
                            if (gmlId) {
                                objectItems.push({ gmlId });
                            }
                        });
                        objectList.objectItems = objectItems;
                        delete (objectList as unknown as { features?: FeatureType[]; }).features;
                    }
                    objectList.xId = objectList.layerXid;
                    delete objectList.layerXid;
                });

                this.workspaceData.groupList[i].layers = storedLayerObjectsList;
                delete (this.workspaceData.groupList[i] as unknown as { objects?: any[] }).objects;
            }
        }
        if (needRewrite) {
            this.writeWorkspaceData(true);
        }
    }

    /**
     * @deprecated
     * @private
     */
    private validateStoredItem(items: StoredLayerItem[]): StoredLayerItem[] {
        const result: any[] = [];

        for (let j = 0; j < items.length; j++) {
            const oldItem = items[j] as unknown as FeatureType;
            const layer = this.map.getVectorLayer('' + oldItem.properties.mapid);
            if (layer) {
                let storedLayerObjects = result.find(storedLayerObject => storedLayerObject.layerXid === layer.xId);
                if (!storedLayerObjects) {
                    storedLayerObjects = {
                        layerXid: layer.xId,
                        objectItems: []
                    };
                    result.push(storedLayerObjects);
                }

                const gmlId = oldItem.properties.id;
                if (gmlId) {
                    storedLayerObjects.objectItems.push({ gmlId });
                }
            }
        }

        return result;

    }
}
