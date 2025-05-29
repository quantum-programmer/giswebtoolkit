/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          объект НСПД                             *
 *                                                                  *
 *******************************************************************/

import MapWindow from '~/MapWindow';
import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import GwtkNspdObjectWidget from './GwtkNspdObjectWidget.vue';
import SearchManager, { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import MapObject from '~/mapobject/MapObject';
import i18n from '@/plugins/i18n';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';
import Layer from '~/maplayers/Layer';

export const UPDATE_SEARCH_PROGRESS_BAR = 'gwtknspdobject.searchrogressbar';
export const UPDATE_SEARCH_TEXT = 'gwtknspdobject.updatesearchtext';
export const ABORT_SEARCH = 'gwtknspdobject.abortsearch';
export const ON_SELECT_OBJECT_TYPE = 'gwtknspdobject.onselectobjecttype';
export const CLEAR_SEARCH = 'gwtknspdobject.clearsearch';
export const START_SEARCH = 'gwtknspdobject.startsearch';
export const GET_SEMANTIC_LIST = 'gwtknspdobject.onselectlayer';
export const SET_ACTIVE_GROUP = 'gwtknspdobject.setactivegroup';
export const SHOW_OBJECT = 'gwtknspdobject.showobject';
export const SET_ACTIVE_OBJECT_INDEX = 'gwtknspdobject.setactiveobjectindex';

type WidgetParams = {
    setState: GwtkNspdObjectTask['setState'];
    searchText: string;
    searchProgressBar: boolean;
    selectedObjectType: number[];
    mapObjects: MapObject[];
    objectsGroups: ObjectsGroup[];
    mapObjectSemantics: MapObjectSemanticContent[];
    objectIndex: number;
    activeGroup: string;
}

export type GwtkNspdObjectTaskState = {
    [UPDATE_SEARCH_PROGRESS_BAR]: boolean;
    [UPDATE_SEARCH_TEXT]: string;
    [ABORT_SEARCH]: undefined;
    [ON_SELECT_OBJECT_TYPE]: number;
    [CLEAR_SEARCH]: undefined;
    [START_SEARCH]: undefined;
    [GET_SEMANTIC_LIST]: undefined;
    [SET_ACTIVE_GROUP]: string;
    [SHOW_OBJECT]: undefined;
    [SET_ACTIVE_OBJECT_INDEX]: number;
}

export type ObjectsGroup = {
    id: string,
    groupName: string,
    objects: MapObject[]
}


export default class GwtkNspdObjectTask extends Task {


    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    private readonly nspdSearchManager = new SearchManager(this.map, true);

    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        // Создание Vue компонента
        this.widgetProps = {
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            taskId: this.id,
            setState: this.setState.bind(this),
            searchText: '',
            searchProgressBar: false,
            selectedObjectType: [],
            mapObjects: [],
            objectsGroups: [],
            mapObjectSemantics: [],
            objectIndex: 0,
            activeGroup: '',
        };
    }

    createTaskPanel() {
        // регистрация Vue компонента
        const name = 'GwtkNspdObjectWidget';
        const source = GwtkNspdObjectWidget;
        this.mapWindow.registerComponent(name, source);

        this.mapWindow.createWindowWidget(name, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);

    }

    setState<K extends keyof GwtkNspdObjectTaskState>(key: K, value: GwtkNspdObjectTaskState[K]) {
        switch (key) {
            case UPDATE_SEARCH_PROGRESS_BAR:
                this.widgetProps.searchProgressBar = value as boolean;
                break;
            case UPDATE_SEARCH_TEXT:
                this.widgetProps.searchText = value === null ? '' : value as string;
                break;
            case ABORT_SEARCH:
                this.abortSearch();
                break;
            case ON_SELECT_OBJECT_TYPE:
                const index = this.widgetProps.selectedObjectType.findIndex((item) => item === value as number);
                if (index !== -1) {
                    this.widgetProps.selectedObjectType.splice(index, 1);
                } else {
                    this.widgetProps.selectedObjectType.push(value as number);
                }
                break;
            case CLEAR_SEARCH:
                this.widgetProps.mapObjectSemantics.splice(0);
                this.nspdSearchManager.clearSearchCriteriaAggregator();
                this.widgetProps.searchText = '';
                this.map.clearHighLightObject();
                this.map.tiles.drawMapImage(true, true, true);
                break;
            case START_SEARCH:
                this.map.clearActiveObject();
                this.widgetProps.objectIndex = 0;
                this.setState(UPDATE_SEARCH_PROGRESS_BAR, true);
                this.searchViaSearchManager();
                break;
            case GET_SEMANTIC_LIST:
                this.widgetProps.mapObjectSemantics = this.getSemanticList();
                break;
            case SET_ACTIVE_GROUP:
                this.widgetProps.objectIndex = 0;
                this.widgetProps.activeGroup = value as string;
                this.setState(GET_SEMANTIC_LIST, undefined);
                break;
            case SHOW_OBJECT:
                this.showObject();
                break;
            case SET_ACTIVE_OBJECT_INDEX:
                this.widgetProps.objectIndex = value as number;
                break;

        }
    }

    showObject() {
        const group = this.widgetProps.objectsGroups.find((item) => item.id === this.widgetProps.activeGroup);
        if (group && this.widgetProps.objectIndex !== undefined && this.widgetProps.objectIndex >= 0 ) {
            const selectObject = group.objects[this.widgetProps.objectIndex];
            if (selectObject) {
                this.map.setActiveObject(selectObject);
                this.map.setMapCenter(selectObject.getCenter(), true);
            }
        }
    }

    getSemanticList() {
        const semanticList = [];
        if (this.widgetProps.objectIndex < 0) {
            this.widgetProps.objectIndex = 0;
        }

        let selectObject;

        const group = this.widgetProps.objectsGroups.find((item) => item.id === this.widgetProps.activeGroup);
        if (group) {
            selectObject = group.objects[this.widgetProps.objectIndex];
        }


        if (selectObject) {
            this.showObject();

            this.map.tiles.wmsManager.onMapDragEnd();

            const objectSemantic = this.getObjectSemantics(selectObject);
            
            if (objectSemantic.length > 0) {
                for (let numberSemantic = 0; numberSemantic < objectSemantic.length; numberSemantic++) {
                    const currentSemantic = objectSemantic[numberSemantic];
                    semanticList.push(currentSemantic);
                }
            }
        }
        return semanticList;

    }

    getObjectSemantics(searchMapObject: MapObject) {
        const result: MapObjectSemanticContent[] = [];


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

    private checkSemanticFilter(key: string): boolean {
        const semanticFilter = this.layer ? this.layer.options.semanticfilter : false;
        return !semanticFilter || semanticFilter.length === 0 || semanticFilter.indexOf(key) !== -1;
    }

    private get layer(): Layer | undefined {
        let result;

        const selectObject = this.nspdSearchManager.mapObjects[0];

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

    private abortSearch(): void {
        this.nspdSearchManager.stopSearch();
    }

    private async searchViaSearchManager() {
        let text: string = this.widgetProps.searchText;
        if (text === '') {
            this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
            return;
        }

        if (this.widgetProps.selectedObjectType.length === 0) {
            this.widgetProps.selectedObjectType.push(1);
        }
        this.widgetProps.mapObjects.splice(0);

        for (let i = 0; i < this.widgetProps.selectedObjectType.length; i++) {
            const searchManager = this.nspdSearchManager;

            searchManager.activateSource(SourceType.Nspd, GISWebServiceSEMode.TextSearch);
    
            searchManager.clearSearchCriteriaAggregator();
    
            searchManager.clearSearchCriteriaAggregator();
            const criteriaAggregatorCopy = searchManager.getSearchCriteriaAggregatorCopy();
    
            const textSearchCriterion = criteriaAggregatorCopy.getTextSearchCriterion();
            textSearchCriterion.addTextSearchKey(['Text'], text);
    
            textSearchCriterion.addTextSearchKey(['thematicSearchId'], this.widgetProps.selectedObjectType[i] + '');
    
            const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
            srsNameSearchCriterion.setValue(this.map.getCrsString());
    
            searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);
    
            this.map.tiles.drawMapImage(true, true, true);
            this.widgetProps.objectsGroups.splice(0);
            await searchManager.findNext().then(() => {
                if (this.nspdSearchManager.mapObjects.length > 0) {
                    this.widgetProps.mapObjects = this.widgetProps.mapObjects.concat(this.nspdSearchManager.mapObjects);
                }
            });
        }

        if (this.widgetProps.mapObjects.length) {
            this.fillObjectsGroups();
        } else {
            this.mapWindow.addSnackBarMessage(i18n.tc('phrases.' + 'Objects with this properties not found') + '.');
        }

        this.widgetProps.searchText = '';
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
    }

    fillObjectsGroups() {
        this.widgetProps.objectsGroups.splice(0);

        for (let i = 0; i < this.widgetProps.mapObjects.length; i++) {
            const object = this.widgetProps.mapObjects[i];

            const groupId = object.getRepeatableSemantics('category')[0]?.value || '';
            const groupName = object.getRepeatableSemantics('category')[0]?.name || '';

            const idx = this.widgetProps.objectsGroups.findIndex((item) => item.id === groupId);

            if (idx === -1) {
                this.widgetProps.objectsGroups.push({
                    id: groupId,
                    groupName: groupName,
                    objects: [object]
                });
            } else {
                this.widgetProps.objectsGroups[idx].objects.push(object);
            }
        }

        this.getSemanticList();
    }

}