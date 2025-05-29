/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                   Виджет компонента объект НСПД                  *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { 
    ABORT_SEARCH, 
    CLEAR_SEARCH, 
    GET_SEMANTIC_LIST, 
    GwtkNspdObjectTaskState, 
    ObjectsGroup, 
    ON_SELECT_OBJECT_TYPE, 
    SET_ACTIVE_GROUP, 
    SET_ACTIVE_OBJECT_INDEX, 
    SHOW_OBJECT, START_SEARCH, 
    UPDATE_SEARCH_PROGRESS_BAR, 
    UPDATE_SEARCH_TEXT 
} from './GwtkNspdObjectTask';
import objectTypesJson from './objectType.json';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';

const CadNumKey = 'KADNUM';

@Component
export default class GwtkNspdObjectWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    readonly taskId!: string;

    @Prop({ default: () => ({}) })
    readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkNspdObjectTaskState>(key: K, value: GwtkNspdObjectTaskState[K]) => void;

    @Prop({ default: '' })
    readonly searchText!: string;

    @Prop({ default: true })
    readonly searchProgressBar!: boolean;

    @Prop({ default: -1 })
    readonly selectedObjectType!: number[];

    @Prop({ default: [] })
    readonly objectsGroups!: ObjectsGroup[];

    @Prop({ default: [] })
    readonly mapObjectSemantics!: MapObjectSemanticContent[];

    @Prop({ default: '' })
    readonly activeGroup!: string;

    @Prop({ default: 0 })
    readonly objectIndex!: number;

    isReducedSizeInterface = false;

    get showObject() {
        return this.mapObjectSemantics.length > 0;
    }

    get objectTypes() {
        return objectTypesJson;
    }

    get selectedTypeIndex() {
        let result: number[] = [];
        for (let i = 0; i < this.objectTypes.length; i++) {
            if ( this.selectedObjectType.includes(this.objectTypes[i].id)) {
                result.push(i);
            }
        }
        return result;
    }

    set selectedTypeIndex(value) {

    }

    get activeTabWidget(): string {
        return '0';
    }

    set activeTabWidget(value: string) {
        this.setState(SET_ACTIVE_GROUP, String(value));
    }

    get cadNumberText() {
        let result = '';
        const semantic = this.mapObjectSemantics.find((item) => item.key === CadNumKey);
        if (semantic) {
            result = semantic.value;
        }
        return result;
    }

    get hasNextObject() {
        let result = false;
        const group = this.objectsGroups.find((item) => item.id === this.activeGroup);
        if (group && this.objectIndex !== undefined) {
            result = !!group.objects[this.objectIndex + 1];
        }
        return result;
    }

    get hasPreviousObject() {
        let result = false;
        const group = this.objectsGroups.find((item) => item.id === this.activeGroup);
        if (group && this.objectIndex !== undefined) {
            result = !!group.objects[this.objectIndex - 1];
        }
        return result;
    }

    created() {
        for (let i = 0; i < this.objectTypes.length; i++) {
            if (this.objectTypes[i].defaultThematic) {
                this.onSelectObjectType(this.objectTypes[i].id);
                break;
            }
        }

        this.isReducedSizeInterface = this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);

    }


    onInput(value: string) {
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        this.setState(UPDATE_SEARCH_TEXT, value);
    }

    closeOverlay() {
        this.setState(UPDATE_SEARCH_PROGRESS_BAR, false);
        this.setState(ABORT_SEARCH, undefined);
    }

    onSelectObjectType(id: number) {
        this.setState(ON_SELECT_OBJECT_TYPE, id);
    }

    clearSearchText() {
        this.setState(CLEAR_SEARCH, undefined);
    }

    search() {
        this.setState(START_SEARCH, undefined);
    }

    showObjectInMap() {
        this.setState(SHOW_OBJECT, undefined);
    }

    prevObjectInfo() {
        this.setState(SET_ACTIVE_OBJECT_INDEX, this.objectIndex - 1);
        this.setState(GET_SEMANTIC_LIST, undefined);
        // this.showObjectInMap();
    }

    nextObjectInfo() {
        this.setState(SET_ACTIVE_OBJECT_INDEX, this.objectIndex + 1);
        this.setState(GET_SEMANTIC_LIST, undefined);
        // this.showObjectInMap();
    }

    getTypeChecked(id: number) {
        return this.selectedObjectType.includes(id);
    }

}